from PIL import Image, ImageChops
import math, operator
import itertools

def get_tiles(tileset):
    width, height = tileset.size

    tiles = [[tileset.crop((x, y, x + 16, y + 16)).convert("RGB")
              for x in range(0, width, 16)]
             for y in range(0, height, 16)]

    return tiles

def rmsdiff(im1, im2):
    "Calculate the root-mean-square difference between two images"

    diff = ImageChops.difference(im1, im2)
    h = diff.histogram()
    sq = (value*((idx % 256)**2) for idx, value in enumerate(h))
    sum_of_squares = sum(sq)
    rms = math.sqrt(sum_of_squares/float(im1.size[0] * im1.size[1]))
    return rms

def main():
    tileset_tiles = sum(get_tiles(Image.open("tileset.png")), []) # flatten

    map_tile_matrix = get_tiles(Image.open("mario-1-1.gif"))

    map_matrix = [[sorted(range(0, len(tileset_tiles)), key=lambda i: rmsdiff(map_tile, tileset_tiles[i]))[0]
                   for map_tile in row] for row in map_tile_matrix]

    for row in map_matrix:
        for tile in row:
            print tile,
        print

if __name__ == "__main__":
    main()
